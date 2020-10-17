#!/usr/bin/env python3

import json
import time
import argparse
import sqlite3
import os.path
from prometheus_client import start_http_server
from prometheus_client.core import CounterMetricFamily, GaugeMetricFamily, REGISTRY

class TerryCollector():
    def __init__(self, db: str):
        self.db = db

    def query(self, cur: sqlite3.Cursor, query: str, args = []):
        res = cur.execute(query, args)
        return res.fetchone()[0]

    def collect(self):
        conn = sqlite3.connect(self.db)
        cur = conn.cursor()

        metric = CounterMetricFamily("terry_users_total", "Total number of users")
        metric.add_metric([], self.query(cur, "SELECT COUNT(*) FROM users"))
        yield metric

        metric = CounterMetricFamily("terry_users_logged", "Number of logged users")
        metric.add_metric([], self.query(cur, "select count(distinct token) from ips"))
        yield metric

        metric = CounterMetricFamily("terry_users_submitted", "Number of users that submitted")
        metric.add_metric([], self.query(cur, "select count(distinct token) from submissions"))
        yield metric

        metric = CounterMetricFamily("terry_users_non_zero", "Number of users that scored more than zero")
        metric.add_metric([], self.query(cur, "select count(distinct token) from user_tasks where score > 0"))
        yield metric


        metric = CounterMetricFamily("terry_inputs_generated", "Number of generated input files", labels=["task"])
        query = cur.execute("""
            select name, count(inputs.task)
            from tasks
            left join inputs on tasks.name = inputs.task
            group by name
        """)
        for task, count in query.fetchall():
            metric.add_metric([task], count)
        yield metric

        metric = CounterMetricFamily("terry_outputs_uploaded", "Number of uploaded output files", labels=["task"])
        query = cur.execute("""
            select name, count(outputs.id)
            from tasks
            left join inputs on tasks.name = inputs.task
            left join outputs on inputs.id = outputs.input
            group by name
        """)
        for task, count in query.fetchall():
            metric.add_metric([task], count)
        yield metric

        metric = CounterMetricFamily("terry_sources_uploaded", "Number of uploaded source files", labels=["task"])
        query = cur.execute("""
            select name, count(sources.id)
            from tasks
            left join inputs on tasks.name = inputs.task
            left join sources on inputs.id = sources.input
            group by name
        """)
        for task, count in query.fetchall():
            metric.add_metric([task], count)
        yield metric

        metric = CounterMetricFamily("terry_sources_lang", "Number of submissions per language", labels=["task", "language"])
        query = cur.execute("""
            select task, sources.path
            from sources
            join inputs on sources.input = inputs.id
            """)
        subs_per_lang = {}
        for task, path in query.fetchall():
            _, ext = os.path.splitext(path)
            subs_per_lang.setdefault(task, dict()).setdefault(ext, 0)
            subs_per_lang[task][ext] += 1
        for task, langs in subs_per_lang.items():
            for lang, count in langs.items():
                metric.add_metric([task, lang], count)
        yield metric

        metric = CounterMetricFamily("terry_submissions", "Number of submissions", labels=["task"])
        query = cur.execute("""
            select name, count(submissions.id)
            from tasks
            left join submissions on tasks.name = submissions.task
            group by name
        """)
        for task, count in query.fetchall():
            metric.add_metric([task], count)
        yield metric

        metric = GaugeMetricFamily("terry_tasks_max_score", "Maximum score per task", labels=["task"])
        query = cur.execute("select task, max(score) from user_tasks group by task;")
        for task, score in query.fetchall():
            metric.add_metric([task], score)
        yield metric

        conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("db", help="Path to the terry's db.sqlite3")
    parser.add_argument(
        "--port", default=9114, type=int, help="Port for the prometheus exporter"
    )
    args = parser.parse_args()
    REGISTRY.register(TerryCollector(args.db))
    start_http_server(args.port)
    print("Started at http://0.0.0.0:%s/metric" % args.port)
    while True: time.sleep(1)