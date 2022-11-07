const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const AuthorizationError = require("../../exceptions/AuthorizationError");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const { mapPlaylistsDBToModel } = require("../../utils");

class PlaylistsService {
  constructor(songsService) {
    this._pool = new Pool();
    this._songsService = songsService;
  }

  async getUsername(id) {
    const queryGetUsername = {
      text: "SELECT username FROM users WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(queryGetUsername);
    return result.rows[0].username;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO playlists VALUES($1, $2, $3) RETURNING id",
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Playlist gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getPlaylists(id) {
    const query = {
      text: "SELECT * FROM playlists WHERE owner = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlists tidak ditemukan");
    }

    const user = await this.getUsername(id);

    return result.rows
      .map(mapPlaylistsDBToModel)
      .map(({ id, name, username }) => ({ id, name, username: user }));
  }

  async deletePlaylistById(id) {
    const query = {
      text: "DELETE FROM playlists WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist gagal dihapus. Id tidak ditemukan");
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: "SELECT * FROM playlists WHERE id = $1",
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError("Playlist tidak ditemukan");
    }
    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const res = await this._songsService.getSongById(songId);
    if (!res) {
      throw new NotFoundError("Song tidak ditemukan");
    }

    const id = `playlistINsong-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id",
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Song gagal ditambahkan di Playlist");
    }

    return result.rows[0].id;
  }

  async getSongsInPlaylist(playlistId) {
    const query = {
      text: "SELECT playlists.id AS playlist_id, playlists.name, playlists.owner, songs.id AS song_id, songs.title, songs.performer FROM playlists JOIN playlist_songs ON playlists.id = playlist_songs.playlist_id JOIN songs ON songs.id = playlist_songs.song_id WHERE playlists.id = $1",
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlists tidak ditemukan");
    }
    const rawData = result.rows;
    const { playlist_id: id, name, owner } = rawData[0];
    const username = await this.getUsername(owner);

    const songs = rawData.map(({ song_id, title, performer }) => ({
      id: song_id,
      title,
      performer,
    }));

    return { id, name, username, songs };
  }

  async deleteSongInPlaylistById(id) {
    const res = await this._songsService.getSongById(id);
    if (!res) {
      throw new NotFoundError("Song tidak ditemukan");
    }

    const query = {
      text: "DELETE FROM playlist_songs WHERE song_id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError("Playlist gagal dihapus. Id tidak ditemukan");
    }
  }
}

module.exports = PlaylistsService;
