const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const { mapAlbumDBToModel, mapSongsDBToModel } = require("../../utils");

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year, coverUrl }) {
    const id = `album-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO albums VALUES($1, $2, $3, $4) RETURNING id",
      values: [id, name, year, coverUrl ?? null],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query("SELECT * FROM albums");
    return result.rows.map(mapAlbumDBToModel);
  }

  async getAlbumById(id) {
    const query = {
      text: "SELECT * FROM albums WHERE id = $1",
      values: [id],
    };

    const query2 = {
      text: "SELECT * FROM songs WHERE album_id = $1",
      values: [id],
    };
    const result = await this._pool.query(query);
    const result2 = await this._pool.query(query2);

    if (!result.rows.length) {
      throw new NotFoundError("Album tidak ditemukan");
    }
    const finalResult = result.rows.map(mapAlbumDBToModel)[0];
    finalResult.songs = result2.rows.map(mapSongsDBToModel);
    return finalResult;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: "UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id",
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal memperbarui album. Id tidak ditemukan");
    }
  }

  async updateCoverAlbum(id, cover) {
    const query = {
      text: "UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id",
      values: [cover, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Gagal memperbarui album. Id tidak ditemukan");
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: "DELETE FROM albums WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Album gagal dihapus. Id tidak ditemukan");
    }
  }

  async addLikeInAlbum(userId, albumId) {
    const queryIsAlreadyLike = {
      text: "SELECT COUNT(*) FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };

    const isLike = await this._pool.query(queryIsAlreadyLike);

    if (parseInt(isLike.rows[0].count) > 0) {
      const query = {
        text: "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id",
        values: [userId, albumId],
      };

      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError("Album gagal dihapus. Id tidak ditemukan");
      }
      await this._cacheService.delete(`albumsLikes:${albumId}`);
      return "Batal menyukai album";
    }

    const id = `albumLikes-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id",
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal disukai");
    }
    await this._cacheService.delete(`albumsLikes:${albumId}`);
    return "Menyukai album";
  }

  async getLikesInAlbum(id) {
    try {
      // mendapatkan jumlah like dari cache
      const result = await this._cacheService.get(`albumsLikes:${id}`);
      return { isCache: true, likes: parseInt(result) };
    } catch (error) {
      const query = {
        text: "SELECT COUNT(*) FROM user_album_likes WHERE album_id = $1",
        values: [id],
      };

      const result = await this._pool.query(query);
      if (!result) {
        throw new InvariantError("Gagal mendapatkan jumlah like album");
      }
      // catatan akan disimpan pada cache sebelum fungsi getNotes dikembalikan
      await this._cacheService.set(`albumsLikes:${id}`, result.rows[0].count);
      return { isCache: false, likes: parseInt(result.rows[0].count) };
    }
  }
}

module.exports = AlbumsService;
