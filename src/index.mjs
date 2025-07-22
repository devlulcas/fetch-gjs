import GLib from "gi://GLib";
import Soup from "gi://Soup";

// GJS does not have fetch, so we implement a minimal fetch-like API using GNOME Soup 3.0
// Docs: https://libsoup.gnome.org/libsoup-3.0/index.html
// Async in GJS: https://gjs.guide/guides/gjs/asynchronous-programming.html
// Soup3 in GJS: https://gjs.guide/extensions/upgrading/gnome-shell-43.html#soup3

/**
 * @typedef {function(Readonly<URL | string>, Readonly<RequestInit>): Promise<Response>} FetchFunction
 */

/**
 * @param {Soup.Session} session
 * @returns {FetchFunction}
 */
export function makeFetch(session) {
  if (!session) {
    throw new Error("Session is required");
  }

  return (url, options = {}) => {
    const urlObject = URL.canParse(url) ? URL.parse(url) : null;

    if (!urlObject) {
      throw new Error(
        `Invalid URL. Expected a string or URL object, got ${typeof url}. This failed because URL.canParse returned false.`
      );
    }

    const urlString = urlObject.toString();

    return new Promise((resolve, reject) => {
      // Prepare method and body
      const method = options.method ? options.method.toUpperCase() : "GET";

      /** @type {string | null} */
      let body = null;
      if (options.body) {
        if (typeof options.body === "string") {
          body = options.body;
        } else if (options.body instanceof Uint8Array) {
          body = new TextDecoder().decode(options.body);
        } else {
          reject(
            new Error(
              `Unsupported body type. Expected a string or Uint8Array, got ${typeof options.body}.`,
              { cause: options.body }
            )
          );
          return;
        }
      }

      // Prepare headers
      const headers = new Soup.MessageHeaders(Soup.MessageHeadersType.REQUEST);
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          headers.append(key, value);
        }
      }

      // Create the Soup.Message
      const message = Soup.Message.new(method, urlString);
      // Set headers
      for (const [key, value] of Object.entries(options.headers || {})) {
        message.request_headers.append(key, value);
      }
      // Set body
      if (body) {
        const bytes = new GLib.Bytes(new TextEncoder().encode(body));
        message.set_request_body_from_bytes("text/plain", bytes);
      }

      // Send the request asynchronously
      session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (session, res) => {
          try {
            if (!session) {
              throw new Error("Session is required");
            }

            const bytes = session.send_and_read_finish(res);
            const responseBody = bytes?.get_data()?.toString() ?? "";

            const responseHeaders = () => {
              const out = new Headers();
              message.response_headers.foreach((name, value) => {
                out.append(name, value);
              });
              return out;
            };

            // Build a minimal Response-like object
            /** @satisfies {Partial<Response>} */
            const response = {
              ok: message.status_code >= 200 && message.status_code < 300,
              status: message.status_code,
              statusText: message.reason_phrase,
              headers: responseHeaders(),
              text: async () => responseBody,
              json: async () => JSON.parse(responseBody),
              redirected: false,
              type: "default",
              url: urlString,
              bodyUsed: true,
              arrayBuffer: async () => {
                return new TextEncoder().encode(responseBody);
              },
              blob: async () => new Blob([responseBody]),
              formData: async () => {
                const formData = new FormData();
                formData.append("body", responseBody);
                return formData;
              },
              clone: () => response,
              body: new ReadableStream({
                start(controller) {
                  controller.enqueue(new TextEncoder().encode(responseBody));
                  controller.close();
                },
              }),
            };

            resolve(response);
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  };
}

// Caveats:
// - This implementation is minimal and does not support streaming bodies, abort signals, or cookies.
// - The Soup.Session should be reused for performance in real applications.
// - Only basic headers and body types are supported.
// - GJS and Soup APIs are not 100% fetch-compatible, so some edge cases may differ.
