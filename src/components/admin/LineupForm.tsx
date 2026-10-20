"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Crosshair, Plus, Trash2, Upload, AlertCircle, ArrowLeft } from "lucide-react";
import { MapBoard } from "@/components/lineup/MapBoard";
import { attachMedia, publishLineup, removeMedia, saveLineup } from "@/lib/actions/admin";
import { MEDIA_LIMITS, mediaKindOf } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { MEDIA_BUCKET } from "@/lib/supabase/env";
import type { Character, GameMap, Lineup, MediaKind, MediaRole, Purpose, Side, SkillSlot } from "@/types/domain";

interface LineupFormProps {
  maps: GameMap[];
  characters: Character[];
  purposes: Purpose[];
  initialLineup?: Lineup;
}

interface NewMediaFile {
  file: File;
  kind: MediaKind;
  role: MediaRole;
  previewUrl: string;
}

export function LineupForm({ maps, characters, purposes, initialLineup }: LineupFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // フォーム状態
  const [mapId, setMapId] = useState(initialLineup?.map.id ?? maps[0]?.id ?? "");
  const selectedMap = maps.find((m) => m.id === mapId) ?? maps[0];

  const [characterId, setCharacterId] = useState(initialLineup?.character.id ?? characters[0]?.id ?? "");
  const selectedCharacter = characters.find((c) => c.id === characterId) ?? characters[0];

  const [side, setSide] = useState<Side>(initialLineup?.side ?? "attack");
  const [siteId, setSiteId] = useState(initialLineup?.site.id ?? selectedMap?.sites[0]?.id ?? "");
  const [skillId, setSkillId] = useState(initialLineup?.skill.id ?? selectedCharacter?.skills[0]?.id ?? "");

  const [selectedPurposes, setSelectedPurposes] = useState<string[]>(
    initialLineup?.purposes.map((p) => p.id) ?? []
  );

  const [title, setTitle] = useState(initialLineup?.title ?? "");
  const [aimNote, setAimNote] = useState(initialLineup?.aim_note ?? "");

  // 座標状態 (0.0 ~ 1.0)
  const [startX, setStartX] = useState(initialLineup?.start_x ?? 0.5);
  const [startY, setStartY] = useState(initialLineup?.start_y ?? 0.5);
  const [landX, setLandX] = useState(initialLineup?.land_x ?? 0.5);
  const [landY, setLandY] = useState(initialLineup?.land_y ?? 0.5);
  const [pickTarget, setPickTarget] = useState<"start" | "land">("start");

  // メディア状態
  const [existingMedia, setExistingMedia] = useState(initialLineup?.media ?? []);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<NewMediaFile[]>([]);

  // マップ変更時のサイト追従
  function handleMapChange(newMapId: string) {
    setMapId(newMapId);
    const m = maps.find((item) => item.id === newMapId);
    if (m && m.sites[0]) {
      setSiteId(m.sites[0].id);
    }
  }

  // キャラ変更時のスキル追従
  function handleCharacterChange(newCharId: string) {
    setCharacterId(newCharId);
    const c = characters.find((item) => item.id === newCharId);
    if (c && c.skills[0]) {
      setSkillId(c.skills[0].id);
    }
  }

  // 用途タグのトグル
  function togglePurpose(pId: string) {
    setSelectedPurposes((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  }

  // マップクリック時の座標取得
  function handleMapPick(pt: { x: number; y: number }) {
    if (pickTarget === "start") {
      setStartX(pt.x);
      setStartY(pt.y);
      setPickTarget("land"); // 開始位置の次は着弾位置へ自動切り替え
    } else {
      setLandX(pt.x);
      setLandY(pt.y);
    }
  }

  // ファイル追加
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const added: NewMediaFile[] = [];
    for (const file of files) {
      const kind = mediaKindOf(file.type);
      if (!kind) {
        alert(`${file.name}: 対応していない形式です (mp4, webm, png, jpg, webp)`);
        continue;
      }
      const limit = MEDIA_LIMITS[kind];
      if (file.size > limit.maxBytes) {
        alert(`${file.name}: サイズ上限を超えています (${limit.label})`);
        continue;
      }

      added.push({
        file,
        kind,
        role: kind === "video" ? "execution" : "aim",
        previewUrl: URL.createObjectURL(file),
      });
    }

    setNewFiles((prev) => [...prev, ...added]);
    e.target.value = "";
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function markExistingDelete(id: string) {
    setMediaToDelete((prev) => [...prev, id]);
  }

  // 保存処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    // メディア件数チェック（既存の残り + 新規）
    const remainingCount =
      existingMedia.filter((m) => !mediaToDelete.includes(m.id)).length + newFiles.length;
    if (remainingCount === 0) {
      setError("動画またはスクリーンショットを1件以上追加してください");
      return;
    }

    startTransition(async () => {
      try {
        setStatusMessage("定点基本情報を保存中...");
        // 1. 定点基本情報の保存
        const saveRes = await saveLineup({
          id: initialLineup?.id,
          title: title.trim() || undefined,
          mapId,
          characterId,
          side,
          siteId,
          skillId,
          purposeIds: selectedPurposes,
          start: { x: startX, y: startY },
          land: { x: landX, y: landY },
          aimNote: aimNote.trim() || undefined,
        });

        if (!saveRes.ok) {
          setError(saveRes.error);
          return;
        }

        const lineupId = saveRes.id;
        const supabase = getBrowserSupabase();
        if (!supabase) {
          setError("Supabaseクライアントの初期化に失敗しました");
          return;
        }

        // 2. 新規メディアを Storage に直接アップロード
        if (newFiles.length > 0) {
          setStatusMessage(`メディアをアップロード中 (0/${newFiles.length})...`);
          const attachPayload = [];

          for (let i = 0; i < newFiles.length; i++) {
            const nf = newFiles[i];
            const ext = nf.file.name.split(".").pop()?.toLowerCase() || (nf.kind === "video" ? "mp4" : "png");
            const fileId = crypto.randomUUID();
            const storagePath = `lineups/${lineupId}/${fileId}.${ext}`;

            setStatusMessage(`メディアをアップロード中 (${i + 1}/${newFiles.length})...`);
            const { error: uploadErr } = await supabase.storage
              .from(MEDIA_BUCKET)
              .upload(storagePath, nf.file, {
                cacheControl: "3600",
                upsert: false,
                contentType: nf.file.type,
              });

            if (uploadErr) {
              setError(`メディアのアップロードに失敗しました: ${uploadErr.message}`);
              return;
            }

            attachPayload.push({
              storagePath,
              kind: nf.kind,
              role: nf.role,
              mimeType: nf.file.type,
              sizeBytes: nf.file.size,
              sortOrder: i,
            });
          }

          setStatusMessage("メディアメタデータを登録中...");
          const attachRes = await attachMedia(lineupId, attachPayload);
          if (!attachRes.ok) {
            setError(attachRes.error);
            return;
          }
        }

        // 3. 削除対象メディアの消去
        if (mediaToDelete.length > 0) {
          setStatusMessage("不要メディアを削除中...");
          const delRes = await removeMedia(mediaToDelete);
          if (!delRes.ok) {
            console.error("メディア削除エラー:", delRes.error);
          }
        }

        // 4. 公開ステータスの反映
        setStatusMessage("公開設定を更新中...");
        const pubRes = await publishLineup(lineupId);
        if (!pubRes.ok) {
          setError(pubRes.error);
          return;
        }

        setStatusMessage("保存が完了しました。");
        router.push("/admin");
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "予期せぬエラーが発生しました");
      }
    });
  }

  const previewPins = [
    {
      id: "draft-pin",
      start: { x: startX, y: startY },
      land: { x: landX, y: landY },
      label: "プレビュー",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div role="alert" className="border border-accent bg-accent/10 p-4 text-xs text-accent flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="border border-cyan/40 bg-cyan/10 p-4 text-xs text-cyan">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左: 基本属性設定 */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-fg border-b border-line pb-2">
              01. BASIC ATTRIBUTES
            </h3>

            {/* マップ選択 */}
            <div className="space-y-1.5">
              <label className="label">MAP (必須)</label>
              <select
                value={mapId}
                onChange={(e) => handleMapChange(e.target.value)}
                className="field"
              >
                {maps.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name_ja} ({m.name_en})
                  </option>
                ))}
              </select>
            </div>

            {/* キャラクター選択 */}
            <div className="space-y-1.5">
              <label className="label">AGENT (必須)</label>
              <select
                value={characterId}
                onChange={(e) => handleCharacterChange(e.target.value)}
                className="field"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ja} ({c.name_en})
                  </option>
                ))}
              </select>
            </div>

            {/* 攻防 & サイト */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="label">SIDE (必須)</label>
                <div className="flex gap-2">
                  {(["attack", "defense"] as Side[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSide(s)}
                      data-active={side === s}
                      className="chip flex-1 justify-center"
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label">SITE (必須)</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  className="field"
                >
                  {selectedMap.sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      SITE {s.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* スキル */}
            <div className="space-y-1.5">
              <label className="label">SKILL (必須)</label>
              <select
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="field"
              >
                {selectedCharacter.skills.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    [{sk.slot}] {sk.name_ja} ({sk.name_en})
                  </option>
                ))}
              </select>
            </div>

            {/* 用途タグ（複数選択） */}
            <div className="space-y-1.5 pt-2">
              <label className="label">PURPOSE TAGS (任意・複数可)</label>
              <div className="flex flex-wrap gap-1.5">
                {purposes.map((p) => {
                  const active = selectedPurposes.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePurpose(p.id)}
                      data-active={active}
                      className="chip h-7 text-xs"
                    >
                      #{p.name_ja}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* タイトル */}
            <div className="space-y-1.5 pt-2">
              <label className="label">TITLE (任意・未入力時は自動生成)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="例: Aサイト解除阻止 階段奥スネークバイト"
                className="field"
              />
              <p className="text-[11px] text-muted">
                ※未入力時は「{selectedCharacter.name_ja} {selectedMap.sites.find((s) => s.id === siteId)?.code ?? "A"}サイト {side === "attack" ? "攻撃" : "防衛"} {selectedCharacter.skills.find((sk) => sk.id === skillId)?.name_ja ?? ""}」と表示されます
              </p>
            </div>

            {/* 照準メモ */}
            <div className="space-y-1.5">
              <label className="label">AIM NOTE (任意・200文字以内)</label>
              <textarea
                value={aimNote}
                onChange={(e) => setAimNote(e.target.value)}
                maxLength={200}
                placeholder="例: 看板の右上の角にチャージバーの左端を合わせ、1チャージで発射"
                className="field text-xs"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* 右: 座標ピッカー & メディアアップローダー */}
        <div className="lg:col-span-6 space-y-6">
          {/* 座標ピッカー */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-fg">
                02. POSITIONS (CLICK MAP)
              </h3>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickTarget("start")}
                  data-active={pickTarget === "start"}
                  className="chip h-7 text-xs data-[active=true]:!bg-cyan data-[active=true]:!text-bg"
                >
                  開始位置を指定
                </button>
                <button
                  type="button"
                  onClick={() => setPickTarget("land")}
                  data-active={pickTarget === "land"}
                  className="chip h-7 text-xs"
                >
                  着弾位置を指定
                </button>
              </div>
            </div>

            <p className="text-xs text-muted">
              マップ上をクリックして
              {pickTarget === "start" ? (
                <span className="font-bold text-cyan">【開始位置】</span>
              ) : (
                <span className="font-bold text-accent">【着弾位置】</span>
              )}
              を指定してください。
            </p>

            <div className="max-w-[420px] mx-auto">
              <MapBoard
                src={selectedMap.minimap_path}
                alt={selectedMap.name_ja}
                pins={previewPins}
                selectedId="draft-pin"
                showStart="all"
                onPick={handleMapPick}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="border border-line p-2 bg-surface-2/40">
                <span className="text-cyan font-mono font-bold block mb-0.5">START POSITION</span>
                <span className="font-mono text-fg">
                  ({(startX * 100).toFixed(1)}%, {(startY * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="border border-line p-2 bg-surface-2/40">
                <span className="text-accent font-mono font-bold block mb-0.5">LAND POSITION</span>
                <span className="font-mono text-fg">
                  ({(landX * 100).toFixed(1)}%, {(landY * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* メディアアップローダー */}
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-fg border-b border-line pb-2">
              03. MEDIA (1つ以上必須)
            </h3>

            <p className="text-xs text-muted">
              動画（mp4, webm ≤50MB）または画像（png, jpg, webp ≤5MB）を登録してください。
            </p>

            {/* 既存メディア一覧 */}
            {existingMedia.length > 0 && (
              <div className="space-y-2">
                <label className="label">既存メディア</label>
                <div className="space-y-2">
                  {existingMedia.map((m) => {
                    const isDeleting = mediaToDelete.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-2 border text-xs ${
                          isDeleting
                            ? "border-accent/40 bg-accent/5 opacity-50 line-through"
                            : "border-line bg-surface-2/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold uppercase text-[10px]">
                            [{m.kind}]
                          </span>
                          <span className="text-fg">{m.role}</span>
                        </div>
                        {!isDeleting ? (
                          <button
                            type="button"
                            onClick={() => markExistingDelete(m.id)}
                            className="btn btn-ghost btn-sm text-accent size-7 p-0"
                            title="削除"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <span className="text-[10px] text-accent">削除予定</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 新規追加メディア一覧 */}
            {newFiles.length > 0 && (
              <div className="space-y-2">
                <label className="label">新規アップロード対象</label>
                <div className="space-y-2">
                  {newFiles.map((nf, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 border border-line bg-surface-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-cyan font-bold">
                          [{nf.kind.toUpperCase()}]
                        </span>
                        <span className="text-xs text-fg truncate max-w-[140px] sm:max-w-[200px]">
                          {nf.file.name}
                        </span>
                        <select
                          value={nf.role}
                          onChange={(e) => {
                            const val = e.target.value as MediaRole;
                            setNewFiles((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, role: val } : item))
                            );
                          }}
                          className="field h-7 !py-0 !px-1.5 text-xs w-28"
                        >
                          <option value="execution">実行動画/手順</option>
                          <option value="aim">照準スクショ</option>
                          <option value="other">その他</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeNewFile(idx)}
                        className="btn btn-ghost btn-sm text-accent size-7 p-0"
                        title="除外"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ファイル追加ボタン */}
            <div>
              <label
                htmlFor="media-file-input"
                className="btn btn-secondary w-full justify-center gap-2 cursor-pointer border-dashed"
              >
                <Upload size={16} />
                <span>動画・画像ファイルを選択して追加</span>
              </label>
              <input
                id="media-file-input"
                type="file"
                multiple
                accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 送信アクション */}
      <div className="flex items-center justify-between border-t border-line pt-6">
        <Link href="/admin" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          <span>キャンセル</span>
        </Link>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary cut-br px-8 font-bold"
        >
          {pending ? "SAVING..." : initialLineup ? "定点を更新保存" : "定点を新規保存"}
        </button>
      </div>
    </form>
  );
}
