exports.up = (pgm) => {
  pgm.addColumn("albums", {
    cover_url: {
      type: "TEXT",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn("alboms", "cover_url");
};
