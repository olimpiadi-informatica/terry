#!/usr/bin/env python3

import curses
import datetime
import http.client
import os.path
import subprocess
import threading
import time


def get_service_status(service_name):
    proc = subprocess.run(["systemctl", "is-active", service_name],
                          stdout=subprocess.PIPE)
    return proc.stdout.decode().strip()


def get_service_logs(services):
    command = ["journalctl", "-n", "25"]
    for service in services:
        command += ["-u", service]
    proc = subprocess.run(command, stdout=subprocess.PIPE)
    return proc.stdout.decode()


def get_disk_usage():
    proc = subprocess.run(["bash", "-c",
                           "df --output=used,size -k / | tail -n 1"],
                          stdout=subprocess.PIPE)
    return proc.stdout.decode()


def get_ram_usage():
    proc = subprocess.run(["bash", "-c",
                           "free -t | tail -n 1"],
                          stdout=subprocess.PIPE)
    return proc.stdout.decode()


def get_cpu_usage():
    proc = subprocess.run(["bash", "-c",
                           "env LANG=en_US.UTF-8 "
                           "top -b -n 2 -d 0.1 |"
                           "grep Cpu | "
                           "tail -n 1 |"
                           "awk '{print $2 + $4}'"],
                          stdout=subprocess.PIPE)
    return proc.stdout.decode()


def get_tap0_ip():
    try:
        proc = subprocess.run(["bash", "-o", "pipefail", "-e", "-c",
                               "ip -4 addr show dev tap0 | "
                               "grep inet | "
                               "tr -s ' ' | "
                               "cut -d' ' -f3 |"
                               "head -n 1 |"
                               "cut -d'/' -f1"],
                              stdout=subprocess.PIPE,
                              stderr=subprocess.PIPE)
        if proc.returncode != 0:
            return "error"
        return proc.stdout.decode()
    except:
        return "error"


def get_version():
    if not os.path.exists("/version"):
        return "unknown"
    with open("/version", "r") as f:
        return f.read().strip()


def internet_on():
    conn = http.client.HTTPConnection("territoriali.olinfo.it", timeout=5)
    try:
        conn.request("HEAD", "/")
        conn.close()
        return True
    except:
        conn.close()
        return False


def humanize_size(size):
    return "%.1fG" % (size / 1024 / 1024)


class SystemDWatchdog:
    POLL_INTERVAL = 2

    def __init__(self, services):
        self.services = services
        self.status = dict([(service, "unknown") for service in services])
        self.thread = threading.Thread(target=self._update)
        self.thread.start()

    def _update(self):
        while True:
            for service in self.services:
                try:
                    self.status[service] = get_service_status(service)
                except Exception as ex:
                    self.status[service] = str(ex)
            time.sleep(SystemDWatchdog.POLL_INTERVAL)

    def get_status(self):
        return self.status


class InternetWatchdog:
    POLL_INTERVAL = 2

    def __init__(self):
        self._connected = "unknown"
        self.thread = threading.Thread(target=self._update)
        self.thread.start()

    def _update(self):
        while True:
            try:
                if internet_on():
                    self._connected = "connected"
                else:
                    self._connected = "disconnected"
            except:
                self._connected = "errored"
            time.sleep(SystemDWatchdog.POLL_INTERVAL)

    def status(self):
        return self._connected


class SystemWatchdog:
    POLL_INTERVAL = 2

    def __init__(self):
        self.disk_usage = [0, 1]
        self.ram_usage = [0, 1]
        self.cpu_usage = 0.0
        self.tap_ip = get_tap0_ip()
        self.thread = threading.Thread(target=self._update)
        self.thread.start()

    def _update(self):
        while True:
            try:
                self.disk_usage = list(
                    map(int, filter(lambda x: x, get_disk_usage().split(" "))))
            except:
                self.disk_usage = [0, 1]
            try:
                items = list(filter(lambda x: x, get_ram_usage().split(" ")))
                self.ram_usage = [int(items[2]), int(items[1])]
            except Exception as ex:
                self.ram_usage = [str(ex), "x"]
            try:
                self.cpu_usage = int(float(get_cpu_usage()))
            except Exception as e:
                self.cpu_usage = -1
                with open("/tmp/error", "w") as f:
                    f.write(str(e))
            self.tap_ip = get_tap0_ip()
            time.sleep(SystemDWatchdog.POLL_INTERVAL)

    def get_disk_usage(self):
        return self.disk_usage

    def get_ram_usage(self):
        return self.ram_usage

    def get_cpu_usage(self):
        return self.cpu_usage

    def get_tap_ip(self):
        return self.tap_ip


class Watchdog:
    SERVICES = ["nginx", "sshd", "terry-backend"]

    def __init__(self):
        self.max_x = 100
        self.max_y = 100
        self.systemd = SystemDWatchdog(Watchdog.SERVICES)
        self.internet = InternetWatchdog()
        self.system = SystemWatchdog()
        self.version = get_version()
        self.thread = threading.Thread(target=curses.wrapper, args=(self.ui,))
        self.thread.start()

    def top_part(self, pad):
        pad.clear()
        row = 0
        for service, status in self.systemd.get_status().items():
            pad.addstr(row, 0, "%20s " % service)
            if status == "active":
                pad.addstr(row, 21, "[%s]\n" % status,
                           curses.color_pair(curses.COLOR_GREEN))
            else:
                pad.addstr(row, 21, "[%s]\n" % status,
                           curses.color_pair(curses.COLOR_RED))
            row += 1

        pad.addstr(0, 40, "Server date:", curses.A_BOLD)
        pad.addstr(0, 53, datetime.datetime.now().strftime("%d/%m/%y %H:%M:%S"))

        pad.addstr(1, 40, "Internet:", curses.A_BOLD)
        pad.addstr(1, 53, self.internet.status())

        pad.addstr(2, 40, "Disk usage:", curses.A_BOLD)
        used, total = self.system.get_disk_usage()
        usage = "%s / %s" % (humanize_size(used), humanize_size(total))
        if used / total > 0.8:
            pad.addstr(2, 53, usage, curses.color_pair(curses.COLOR_RED))
        else:
            pad.addstr(2, 53, usage)

        pad.addstr(3, 40, "Ram usage:", curses.A_BOLD)
        used, total = self.system.get_ram_usage()
        usage = "%s / %s" % (humanize_size(used), humanize_size(total))
        if used / total > 0.8:
            pad.addstr(3, 53, usage, curses.color_pair(curses.COLOR_RED))
        else:
            pad.addstr(3, 53, usage)

        pad.addstr(4, 40, "CPU usage:", curses.A_BOLD)
        usage = self.system.get_cpu_usage()
        if usage < 0:
            pad.addstr(4, 53, "error", curses.color_pair(curses.COLOR_RED))
        elif usage > 80:
            pad.addstr(4, 53, "%d%%" % usage, curses.color_pair(
                curses.COLOR_RED))
        else:
            pad.addstr(4, 53, "%d%%" % usage)

        pad.addstr(0, 78, "Version:", curses.A_BOLD)
        pad.addstr(0, 87, self.version)
        pad.addstr(1, 78, "Support:", curses.A_BOLD)
        pad.addstr(1, 87, self.system.get_tap_ip())

        pad.addstr(len(Watchdog.SERVICES) + 2, 0, "Logs:\n", curses.A_BOLD)
        pad.refresh(0, 0, 0, 0, len(Watchdog.SERVICES) + 2, self.max_x - 1)

    def bottom_part(self, pad):
        pad.clear()
        pad.addstr(get_service_logs(Watchdog.SERVICES))
        pad.refresh(self.pos_y, self.pos_x, len(Watchdog.SERVICES) + 3, 0,
                    self.max_y - len(Watchdog.SERVICES) - 3,
                    self.max_x - 1)

    def ui(self, stdscr):
        curses.start_color()
        curses.use_default_colors()
        for i in range(1, curses.COLORS):
            curses.init_pair(i, i, -1)
        curses.halfdelay(10)
        self.pos_y, self.pos_x = 0, 0

        top = curses.newpad(len(Watchdog.SERVICES) + 4, 1000)
        bottom = curses.newpad(1000, 1000)
        while True:
            self.max_y, self.max_x = stdscr.getmaxyx()
            self.top_part(top)
            self.bottom_part(bottom)
            try:
                pressed_key = stdscr.getkey()
                if pressed_key == "KEY_UP":
                    self.pos_y -= 1
                elif pressed_key == "KEY_DOWN":
                    self.pos_y += 1
                elif pressed_key == "KEY_LEFT":
                    self.pos_x -= 1
                elif pressed_key == "KEY_RIGHT":
                    self.pos_x += 1
                self.pos_x = max(self.pos_x, 0)
                self.pos_y = max(self.pos_y, 0)
            except curses.error:
                pass


if __name__ == "__main__":
    Watchdog()
