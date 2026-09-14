import { getAlbums } from "@/lib/albums";
import { AlbumPreviewGrid } from "./AlbumPreviewGrid";

export async function AlbumPreview() {
  return <AlbumPreviewGrid albums={await getAlbums()} />;
}
