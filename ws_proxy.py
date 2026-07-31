import asyncio
import websockets

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 18090
CHAT_HOST = "127.0.0.1"
CHAT_PORT = 9000

async def proxy(client):
    try:
        async with websockets.connect(
            f"ws://{CHAT_HOST}:{CHAT_PORT}",
            max_size=None
        ) as server:

            async def c2s():
                async for msg in client:
                    await server.send(msg)

            async def s2c():
                async for msg in server:
                    await client.send(msg)

            await asyncio.gather(c2s(), s2c())

    except Exception as e:
        print("WS proxy:", e)

async def main():
    async with websockets.serve(
        proxy,
        LISTEN_HOST,
        LISTEN_PORT,
        max_size=None
    ):
        print(f"WS proxy listening on {LISTEN_HOST}:{LISTEN_PORT}")
        await asyncio.Future()

asyncio.run(main())
