const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function uploadPortfolio(
  uris: string[],
  getToken: () => Promise<string | null>,
): Promise<string[]> {
  const urls: string[] = [];

  for (const uri of uris) {
    const token = await getToken();

    const filename = uri.split("/").pop() ?? "image.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png" ? "image/png"
      : ext === "webp" ? "image/webp"
      : ext === "gif" ? "image/gif"
      : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: filename,
      type: mime,
    } as unknown as Blob);

    const response = await fetch(
      `${BASE_URL}/api/users/me/portfolio/upload`,
      {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? `Error subiendo imagen ${filename}`);
    }

    const { url } = await response.json();
    urls.push(url as string);
  }

  return urls;
}
