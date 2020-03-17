module.exports = {
  up: queryInterface => {
    return queryInterface.bulkInsert(
      'recipients',
      [
        {
          name: 'Destinatário Demo 001',
          street: 'Rua Demo 001',
          number: '1',
          complement: ' ',
          state: 'XX',
          city: 'Cidade Demo 001',
          zip_code: '11111-111',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Destinatário Demo 002',
          street: 'Rua Demo 002',
          number: '2',
          complement: ' ',
          state: 'XX',
          city: 'Cidade Demo 002',
          zip_code: '22222-222',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Destinatário Demo 003',
          street: 'Rua Demo 003',
          number: '3',
          complement: ' ',
          state: 'XX',
          city: 'Cidade Demo 003',
          zip_code: '33333-333',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Destinatário Demo 004',
          street: 'Rua Demo 004',
          number: '4',
          complement: ' ',
          state: 'XX',
          city: 'Cidade Demo 004',
          zip_code: '44444-444',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          name: 'Destinatário Demo 005',
          street: 'Rua Demo 005',
          number: '5',
          complement: ' ',
          state: 'XX',
          city: 'Cidade Demo 005',
          zip_code: '55555-555',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  down: () => ({}),
};
