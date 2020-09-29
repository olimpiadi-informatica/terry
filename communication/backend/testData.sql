INSERT INTO
    users (token, isAdmin)
VALUES
    ('admin', 1),
    ('demo', 0),
    ('demo2', 0);

INSERT INTO
    announcements (severity, title, content, creator)
VALUES
    ('danger', 'Announcement 1', 'Looook!!', 'admin'),
    ('success', 'Announcement 2', 'All good', 'admin');

INSERT INTO
    questions (content, creator)
VALUES
    ('How about x?', 'demo'),
    ('How about y?', 'demo'),
    ('Is it all right?', 'demo2');

UPDATE
    questions
SET
    answer = '42',
    answerDate = CURRENT_TIMESTAMP,
    answerer = 'admin'
WHERE
    id = 1;