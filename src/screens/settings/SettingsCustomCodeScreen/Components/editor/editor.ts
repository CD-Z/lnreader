const assetsUriPrefix = __DEV__
  ? 'http://localhost:8081/assets'
  : 'file:///android_asset';

const EDITOR_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0,
        maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html,
      body,
      #editor {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #1e1e1e;
      }

      * {
        box-sizing: border-box;
      }

      input,
      textarea,
      [contenteditable] {
        -webkit-user-select: text;
        user-select: text;
      }
    </style>
    <script
      src="${assetsUriPrefix}/editor/codemirror.js"
    ></script>
  </head>
  <body>
    <div id="editor"></div>

    <script>
      (function () {
        var api = CM6.createEditor(
          document.getElementById('editor'),
        );

        function handleNativeMessage(event) {
          try {
            api.handleMessage(JSON.parse(event.data));
          } catch (error) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({
                type: 'EDITOR_ERROR',
                value:
                  error instanceof Error
                    ? error.message
                    : String(error),
              }),
            );
          }
        }

        document.addEventListener(
          'message',
          handleNativeMessage,
        );
        window.addEventListener(
          'message',
          handleNativeMessage,
        );

        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'READY',
          }),
        );
      })();
    </script>
  </body>
</html>`;
export default EDITOR_HTML;
