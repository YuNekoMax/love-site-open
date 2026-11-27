INSERT OR IGNORE INTO settings (key, value) VALUES
  ('start_date', '2024-01-01T00:00:00+08:00'),
  ('name_me', '你'),
  ('name_partner', 'TA'),
  ('avatar_me', '/avatars/me.svg'),
  ('avatar_partner', '/avatars/partner.svg');

INSERT OR IGNORE INTO milestones (id, title, date, kind, sort) VALUES
  (1, '在一起', '2024-01-01', 'since', 1),
  (2, 'TA 的生日', '01-01', 'yearly', 2),
  (3, '你的生日', '01-01', 'yearly', 3);
