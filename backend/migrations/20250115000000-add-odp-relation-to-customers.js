'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Tambahkan kolom odpId sebagai foreign key dengan tipe INTEGER (sesuai dengan tabel ODPs)
    await queryInterface.addColumn('customers', 'odpId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ODPs',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Hapus kolom odpSlot yang lama (opsional, bisa dipertahankan untuk backward compatibility)
    // await queryInterface.removeColumn('customers', 'odpSlot');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('customers', 'odpId');
    // await queryInterface.addColumn('customers', 'odpSlot', {
    //   type: Sequelize.STRING,
    //   allowNull: true
    // });
  }
};