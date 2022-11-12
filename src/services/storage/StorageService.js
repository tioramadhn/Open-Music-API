const fs = require("fs");

class StorageService {
  constructor(folder, albumsService) {
    this._folder = folder;
    this._albumsService = albumsService;
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }
  async updateCoverUrlAlbums(id, cover) {
    await this._albumsService.updateCoverAlbum(id, cover);
  }
  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const path = `${this._folder}/${filename}`;

    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on("error", (error) => reject(error));
      file.pipe(fileStream);
      file.on("end", () => resolve(filename));
    });
  }
}

module.exports = StorageService;
