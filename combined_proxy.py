import asyncio
from aiohttp import web, ClientSession, WSMsgType

APP = "http://127.0.0.1:5000"
CHAT = "ws://127.0.0.1:9000"

async def handler(request):
    if request.path == "/ws":
        client = web.WebSocketResponse()
        await client.prepare(request)

        try:
            async with ClientSession() as session:
                async with session.ws_connect(
                    CHAT,
                    heartbeat=30,
                    timeout=30
                ) as server:

                    async def c2s():
                        async for msg in client:
                            if msg.type == WSMsgType.TEXT:
                                await server.send_str(msg.data)
                            elif msg.type == WSMsgType.BINARY:
                                await server.send_bytes(msg.data)
                            elif msg.type == WSMsgType.CLOSE:
                                await server.close()
                                break

                    async def s2c():
                        async for msg in server:
                            if msg.type == WSMsgType.TEXT:
                                await client.send_str(msg.data)
                            elif msg.type == WSMsgType.BINARY:
                                await client.send_bytes(msg.data)

                    await asyncio.gather(c2s(), s2c())

        except Exception as e:
            print("WS ERROR:", repr(e))

        return client

    try:
        async with ClientSession() as session:
            async with session.request(
                request.method,
                APP + request.path_qs,
                headers={
                    k: v for k, v in request.headers.items()
                    if k.lower() not in ("host", "connection")
                },
                allow_redirects=False
            ) as r:

                body = await r.read()

                headers = {
                    k: v for k, v in r.headers.items()
                    if k.lower() not in (
                        "content-length",
                        "transfer-encoding",
                        "connection"
                    )
                }

                return web.Response(
                    status=r.status,
                    body=body,
                    headers=headers
                )

    except Exception as e:
        return web.Response(
            status=502,
            text="Proxy error: " + repr(e)
        )

app = web.Application()
app.router.add_route("*", "/{path:.*}", handler)

web.run_app(
    app,
    host="127.0.0.1",
    port=18090
)
