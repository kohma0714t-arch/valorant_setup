-- =====================================================================
-- VALO SET : マスタデータ（マップ / サイト / キャラクター / スキル / 用途）
-- ※定点データ（lineups）は含まない。管理画面から登録する。
-- 再実行可能（upsert）
-- =====================================================================

-- マップ
insert into public.maps (slug, name_ja, name_en, minimap_path, splash_path, sort_order) values
  ('bind',    'バインド', 'Bind',    '/images/maps/bind-mini.png',    '/images/maps/bind-splash.png',    1),
  ('corrode', 'カロード', 'Corrode', '/images/maps/corrode-mini.png', '/images/maps/corrode-splash.png', 2),
  ('sunset',  'サンセット', 'Sunset', '/images/maps/sunset-mini.png',  '/images/maps/sunset-splash.png',  3),
  ('haven',   'ヘイヴン', 'Haven',   '/images/maps/haven-mini.png',   '/images/maps/haven-splash.png',   4)
on conflict (slug) do update set
  name_ja = excluded.name_ja, name_en = excluded.name_en,
  minimap_path = excluded.minimap_path, splash_path = excluded.splash_path,
  sort_order = excluded.sort_order;

-- サイト（ヘイヴンのみ A/B/C）
insert into public.sites (map_id, code, sort_order)
select m.id, s.code, s.ord
from public.maps m
cross join lateral (
  select * from (values ('A', 1), ('B', 2), ('C', 3)) v(code, ord)
  where v.code <> 'C' or m.slug = 'haven'
) s
on conflict (map_id, code) do nothing;

-- キャラクター
insert into public.characters (slug, name_ja, name_en, role, icon_path, sort_order) values
  ('cypher', 'サイファー', 'Cypher', 'sentinel',   '/images/agents/cypher.png', 1),
  ('viper',  'ヴァイパー', 'Viper',  'controller', '/images/agents/viper.png',  2),
  ('sova',   'ソーヴァ',   'Sova',   'initiator',  '/images/agents/sova.png',   3),
  ('fade',   'フェイド',   'Fade',   'initiator',  '/images/agents/fade.png',   4)
on conflict (slug) do update set
  name_ja = excluded.name_ja, name_en = excluded.name_en, role = excluded.role,
  icon_path = excluded.icon_path, sort_order = excluded.sort_order;

-- スキル
insert into public.skills (character_id, slot, name_ja, name_en)
select c.id, v.slot, v.name_ja, v.name_en
from (values
  ('cypher', 'C', 'トラップワイヤー',     'Trapwire'),
  ('cypher', 'Q', 'サイバーケージ',       'Cyber Cage'),
  ('cypher', 'E', 'スパイカメラ',         'Spycam'),
  ('cypher', 'X', 'ニューラル・セフト',   'Neural Theft'),
  ('viper',  'C', 'スネークバイト',       'Snake Bite'),
  ('viper',  'Q', 'ポイズンクラウド',     'Poison Cloud'),
  ('viper',  'E', 'トキシックスクリーン', 'Toxic Screen'),
  ('viper',  'X', 'ヴァイパーズピット',   'Viper''s Pit'),
  ('sova',   'C', 'オウルドローン',       'Owl Drone'),
  ('sova',   'Q', 'ショックダーツ',       'Shock Bolt'),
  ('sova',   'E', 'リコンボルト',         'Recon Bolt'),
  ('sova',   'X', 'ハンターズフューリー', 'Hunter''s Fury'),
  ('fade',   'C', 'プラウラー',           'Prowler'),
  ('fade',   'Q', 'シーズ',               'Seize'),
  ('fade',   'E', 'ホウント',             'Haunt'),
  ('fade',   'X', 'ナイトフォール',       'Nightfall')
) v(agent, slot, name_ja, name_en)
join public.characters c on c.slug = v.agent
on conflict (character_id, slot) do update set
  name_ja = excluded.name_ja, name_en = excluded.name_en;

-- 用途
insert into public.purposes (slug, name_ja, sort_order) values
  ('recon',      '索敵',           1),
  ('anti-defuse','解除阻止',       2),
  ('entry',      'エントリー支援', 3),
  ('retake',     'リテイク',       4),
  ('post-plant', 'ポストプラント', 5),
  ('delay',      '足止め・遅延',   6)
on conflict (slug) do update set
  name_ja = excluded.name_ja, sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------
-- 管理者の登録（初回ログイン後に実行。メールアドレスを置き換える）
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'your-admin@gmail.com'
-- on conflict do nothing;
