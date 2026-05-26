import json
import os
import anthropic
from flask import Flask, Response, jsonify, render_template, request, stream_with_context

MODEL = 'claude-sonnet-4-6'

SPEC_PROMPT = """\
You translate human problem descriptions into Forge specifications.

A Forge spec is an internal format — the human never sees it. It captures:
- What the human needs (not how to build it)
- All assumptions made explicit
- Constraints and guarantees the solution must satisfy
- Concrete examples that prove it works

Format:

  define <ComponentName>
    purpose: one sentence — what this does for the human
    input:
      field: Type
    output:
      field: Type
    requires:
      - assumption in plain English
    ensures:
      - guarantee the solution MUST provide
    effects: [permitted side effects]
    example:
      given:   concrete input
      returns: concrete output  (or "raises: ErrorName")

Permitted effects:
  device.geolocation  http.get  http.post  external.api
  dom.write  db.read  db.write  file.read  file.write
  email.send  slack.read  slack.write

Rules:
1. Break complex needs into 2-5 define blocks
2. Make every assumption explicit in requires/ensures
3. At least one example per block
4. Only list effects actually needed
5. Plain English throughout — never code
6. Output ONLY the spec — no explanation, no fences"""

BUILD_PROMPT = """\
You implement Forge specifications as complete, working software.

The specification defines WHAT the human needs. You decide HOW to build it.

Implementation rules:
1. Every ensures clause must be satisfied
2. Every example must work correctly
3. Only perform side effects listed in effects blocks
4. Handle every error case mentioned in ensures
5. No half-implementations — the result must be immediately usable by a non-technical person

Output format:
  If ANY component has dom.write → single self-contained HTML file:
    - All CSS in <style>, all JS in <script>
    - Modern design: dark theme, clean cards, smooth transitions
    - Fully responsive for mobile and desktop
    - No external CDN dependencies
    - Loading, error, and empty states all handled
  Otherwise → Python 3.10+ script, standard library only unless spec requires more

Output ONLY raw code — no explanation, no fences, no language tags."""

app = Flask(__name__)


def get_client(api_key: str) -> anthropic.Anthropic | None:
    key = api_key or os.environ.get('ANTHROPIC_API_KEY', '')
    return anthropic.Anthropic(api_key=key) if key else None


def sse_stream(client: anthropic.Anthropic, system: str, user_msg: str, max_tokens: int):
    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{'role': 'user', 'content': user_msg}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'chunk': text})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
    except anthropic.AuthenticationError:
        yield f"data: {json.dumps({'error': 'Invalid API key — check your key and try again.'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


def sse_response(gen):
    return Response(
        stream_with_context(gen),
        mimetype='text/event-stream',
        headers={'X-Accel-Buffering': 'no', 'Cache-Control': 'no-cache'},
    )


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/spec', methods=['POST'])
def api_spec():
    api_key = request.headers.get('X-Api-Key', '') or os.environ.get('ANTHROPIC_API_KEY', '')
    client = get_client(api_key)
    if not client:
        return jsonify({'error': 'API key required'}), 401

    description = (request.json or {}).get('description', '').strip()
    if not description:
        return jsonify({'error': 'Description required'}), 400

    return sse_response(sse_stream(client, SPEC_PROMPT, description, 4096))


@app.route('/api/build', methods=['POST'])
def api_build():
    api_key = request.headers.get('X-Api-Key', '') or os.environ.get('ANTHROPIC_API_KEY', '')
    client = get_client(api_key)
    if not client:
        return jsonify({'error': 'API key required'}), 401

    spec = (request.json or {}).get('spec', '').strip()
    if not spec:
        return jsonify({'error': 'Spec required'}), 400

    return sse_response(sse_stream(client, BUILD_PROMPT, spec, 8096))


if __name__ == '__main__':
    import threading, webbrowser
    threading.Thread(target=lambda: __import__('time').sleep(1) or webbrowser.open('http://localhost:5001'), daemon=True).start()
    app.run(port=5001, debug=False, threaded=True)
