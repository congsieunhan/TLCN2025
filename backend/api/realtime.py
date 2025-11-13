import json
import threading
from queue import Queue, Empty


_lock = threading.Lock()
_channels = {}  # key -> set(Queue)


def _key(channel: str, username: str | None = None) -> str:
    return f"{channel}:{username}" if username else channel


def publish(channel: str, payload: dict, username: str | None = None):
    data = {
        "channel": channel,
        "username": username,
        "payload": payload or {},
    }
    key = _key(channel, username)
    with _lock:
        qs = list(_channels.get(key, set()))
    for q in qs:
        try:
            q.put_nowait(data)
        except Exception:
            pass


class Subscription:
    def __init__(self, keys: list[str]):
        self.keys = keys
        self.queue = Queue()
        self.closed = False

    def open(self):
        with _lock:
            for k in self.keys:
                _channels.setdefault(k, set()).add(self.queue)

    def close(self):
        if self.closed:
            return
        self.closed = True
        with _lock:
            for k in self.keys:
                subs = _channels.get(k)
                if not subs:
                    continue
                subs.discard(self.queue)
                if not subs:
                    _channels.pop(k, None)

    def stream(self):
        try:
            while True:
                try:
                    item = self.queue.get(timeout=15)
                    evt = item.get("channel") or "message"
                    txt = json.dumps(item)
                    yield f"event: {evt}\n".encode("utf-8")
                    yield f"data: {txt}\n\n".encode("utf-8")
                except Empty:
                    # heartbeat
                    yield b": keepalive\n\n"
        finally:
            self.close()


def subscribe(keys: list[str]) -> Subscription:
    sub = Subscription(keys)
    sub.open()
    return sub

