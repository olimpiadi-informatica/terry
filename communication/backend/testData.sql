INSERT INTO
    users (token, isAdmin)
VALUES
    ('admin', 1),
    ('user', 0),
    ('user2', 0);

INSERT INTO
    announcements (severity, title, content, creator)
VALUES
    ('danger', 'Announcement 1', 'Looook!!', 'admin'),
    ('success', 'Announcement 2', 'All good', 'admin');

INSERT INTO
    questions (content, creator)
VALUES
    ('How about x?', 'user'),
    ('How about y?', 'user'),
    ('Is it all right?', 'user2');

UPDATE
    questions
SET
    answer = '42',
    answerDate = CURRENT_TIMESTAMP,
    answerer = 'admin'
WHERE
    id = 1;