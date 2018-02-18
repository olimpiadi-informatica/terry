#!/usr/bin/env python3

import curses
import http.client
import subprocess
import threading
import time

import datetime


def get_service_status(service_name):
    proc = subprocess.Popen(["systemctl", "is-active", service_name],
                            stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    return stdout.decode().strip()


def get_service_logs(services):
    command = ["journalctl", "-n", "25"]
    for service in services:
        command += ["-u", service]
    proc = subprocess.Popen(command, stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    return stdout.decode()


def get_disk_usage(disk):
    proc = subprocess.Popen(["bash", "-c",
                             "df --output=used,size %s | tail -n 1" % disk],
                            stdout=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    return stdout.decode()


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
        self._connected = False
        self.thread = threading.Thread(target=self._update)
        self.thread.start()

    def _update(self):
        while True:
            self._connected = internet_on()
            time.sleep(SystemDWatchdog.POLL_INTERVAL)

    def status(self):
        if self._connected:
            return "connected"
        else:
            return "disconnected"


class DiskWatchdog:
    POLL_INTERVAL = 2

    def __init__(self, disk="/dev/sda1"):
        self.usage = "0 1"
        self.disk = disk
        self.thread = threading.Thread(target=self._update)
        self.thread.start()

    def _update(self):
        while True:
            self.usage = get_disk_usage(self.disk)
            time.sleep(SystemDWatchdog.POLL_INTERVAL)

    def get_usage(self):
        return list(map(int, filter(lambda x: x, self.usage.split(" "))))


class Watchdog:
    SERVICES = ["nginx", "sshd", "territoriali-backend"]

    def __init__(self):
        self.max_x = 100
        self.max_y = 100
        self.systemd = SystemDWatchdog(Watchdog.SERVICES)
        self.internet = InternetWatchdog()
        self.disk = DiskWatchdog()
        self.thread = threading.Thread(target=curses.wrapper, args=(self.ui,))
        self.thread.start()

    def top_part(self, pad):
        pad.clear()
        pad.addstr("Services:\n", curses.A_BOLD)
        for service, status in self.systemd.get_status().items():
            pad.addstr("    %25s " % service)
            if status == "active":
                pad.addstr("[%s]\n" % status,
                           curses.color_pair(curses.COLOR_GREEN))
            else:
                pad.addstr("[%s]\n" % status,
                           curses.color_pair(curses.COLOR_RED))

        pad.addstr(0, 50, "Server date:", curses.A_BOLD)
        pad.addstr(0, 63, datetime.datetime.now().strftime("%d/%m/%y %H:%M:%S"))
        pad.addstr(1, 50, "Internet:", curses.A_BOLD)
        pad.addstr(1, 60, self.internet.status())
        pad.addstr(2, 50, "Disk usage:", curses.A_BOLD)
        used, total = self.disk.get_usage()
        usage = "%s / %s" % (humanize_size(used), humanize_size(total))
        if used / total > 0.8:
            pad.addstr(2, 62, usage, curses.color_pair(curses.COLOR_RED))
        else:
            pad.addstr(2, 62, usage)

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
        curses.halfdelay(1)
        self.max_y, self.max_x = stdscr.getmaxyx()
        self.pos_y, self.pos_x = 0, 0

        top = curses.newpad(len(Watchdog.SERVICES) + 4, 1000)
        bottom = curses.newpad(1000, 1000)
        while True:
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
