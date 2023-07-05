#!/usr/bin/env python3

import sys, os
import shutil
import sqlite3
import argparse

def main(args):
    usernames = tuple(open(args.users).read().splitlines())
    tasks = tuple(open(args.tasks).read().splitlines())

    print(f'Extracting solutions for {len(usernames)} users on {len(tasks)} tasks')

    conn = sqlite3.connect(args.db)
    cur = conn.cursor()

    cur.execute('begin transaction;')

    cur.execute('create temporary table algobadge_tokens (token text primary key);')
    cur.executemany(
        'insert into algobadge_tokens values (?);',
        [(x,) for x in usernames]
    )

    cur.execute('create temporary table algobadge_tasks (task text primary key);')
    cur.executemany(
        'insert into algobadge_tasks values (?);',
        [(x,) for x in tasks]
    )

    res = cur.execute("""
        select sub.token, sub.task, sub.score, src.path
        from submissions sub
        join sources src on sub.source=src.id and sub.input=src.input
        where
            sub.token in (select * from temp.algobadge_tokens)
            and sub.task in (select * from temp.algobadge_tasks)
            and not exists (
                select *
                from submissions sub2
                where
                    sub2.token=sub.token
                    and sub2.task=sub.task
                    and (
                        sub2.score > sub.score
                        or (sub2.score=sub.score and sub2.date > sub.date)
                    )
                );
        """).fetchall()

    cur.execute('rollback;') # Just to be safe

    files_dir = os.path.join(os.path.dirname(args.db), 'files')
    for (token, task, score, path) in res:
        print(token, task, score, path)
        target_dir = f'{args.outdir}/{task}/{token}'
        filename = os.path.basename(path)
        target_path = os.path.join(target_dir, filename)
        src_path = os.path.join(files_dir, path)

        os.makedirs(target_dir, exist_ok=True)
        shutil.copyfile(src_path, target_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("db", help="Terry database file")
    parser.add_argument("users", help="users.txt")
    parser.add_argument("tasks", help="tasks.txt")
    parser.add_argument("outdir", help="output folder")
    args = parser.parse_args()

    if os.path.exists(args.outdir):
        print(f"Output folder {args.outdir} already exists. Stopping", file=sys.stderr)
        sys.exit(1)

    main(args)
