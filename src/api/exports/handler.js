const ClientError = require("../../exceptions/ClientError");

class ExportsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postExportPlaylistHandler = this.postExportPlaylistHandler.bind(this);
  }

  async postExportPlaylistHandler(request, h) {
    try {
      const { playlistId } = request.params;
      const { id: userId } = request.auth.credentials;
      this._validator.validateExportPlaylistPayload(request.payload);

      const message = {
        userId,
        playlistId,
        targetEmail: request.payload.targetEmail,
      };

      await this._service.sendMessage(
        "export:playlist",
        JSON.stringify(message),
        playlistId,
        userId
      );

      const response = h.response({
        status: "success",
        message: "Permintaan Anda sedang kami proses",
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: "fail",
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }
      // Server ERROR!
      const response = h.response({
        status: "error",
        message: "Maaf, terjadi kegagalan pada server kami.",
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = ExportsHandler;
