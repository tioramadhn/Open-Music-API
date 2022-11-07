const mapAlbumDBToModel = ({ id, name, year }) => ({
  id,
  name,
  year,
});

const mapSongDBToModel = ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  album_id,
}) => ({
  id,
  title,
  year,
  performer,
  genre,
  duration,
  albumId: album_id,
});

const mapSongsDBToModel = ({ id, title, performer }) => ({
  id,
  title,
  performer,
});

const mapPlaylistsDBToModel = ({ id, name, owner }) => ({
  id,
  name,
  username: owner,
});

module.exports = {
  mapAlbumDBToModel,
  mapSongDBToModel,
  mapSongsDBToModel,
  mapPlaylistsDBToModel,
};
