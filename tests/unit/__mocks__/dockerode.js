module.exports = jest.fn().mockImplementation(() => {
  return {
    listContainers: jest.fn().mockResolvedValue([
      { Names: ['/tempusstack_mocked'], Id: 'mocked123', State: 'running', Ports: [] }
    ]),

    getContainer: jest.fn().mockImplementation(() => ({
      inspect: jest.fn().mockResolvedValue({ id: 'mockedcontainer123', State: { Running: true } }),
      remove: jest.fn().mockResolvedValue(),
      stop: jest.fn().mockResolvedValue()
    })),

    createContainer: jest.fn().mockResolvedValue({
      id: 'mockedcontainer123',
      start: jest.fn().mockResolvedValue()
    }),

    pull: jest.fn((image, cb) => cb(null, {})),

    modem: {
      followProgress: (stream, cb) => cb(null, {})
    }
  };
});
