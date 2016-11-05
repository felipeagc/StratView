# StratView frontend

Uses the phaser library and I have plans to use vue.js as well.

It connects to the backend through websockets to receive live information from the demo. It gets every tick on demand from the server, that way multiple people can watch the same demo at the same time.

I'm still not decided if I'll keep the "on demand" system, as I could just send the whole demo to the client at once.
