export async function onRequestGet() {
  return new Response("google-site-verification: googleb544040039597c55.html\n", {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
