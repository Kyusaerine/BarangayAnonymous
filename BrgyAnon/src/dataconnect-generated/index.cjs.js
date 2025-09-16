const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'barangayanonymous',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createMovieListRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMovieList');
}
createMovieListRef.operationName = 'CreateMovieList';
exports.createMovieListRef = createMovieListRef;

exports.createMovieList = function createMovieList(dc) {
  return executeMutation(createMovieListRef(dc));
};

const getPublicMovieListsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicMovieLists');
}
getPublicMovieListsRef.operationName = 'GetPublicMovieLists';
exports.getPublicMovieListsRef = getPublicMovieListsRef;

exports.getPublicMovieLists = function getPublicMovieLists(dc) {
  return executeQuery(getPublicMovieListsRef(dc));
};

const addMovieToListRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddMovieToList', inputVars);
}
addMovieToListRef.operationName = 'AddMovieToList';
exports.addMovieToListRef = addMovieToListRef;

exports.addMovieToList = function addMovieToList(dcOrVars, vars) {
  return executeMutation(addMovieToListRef(dcOrVars, vars));
};

const getMoviesInListRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMoviesInList', inputVars);
}
getMoviesInListRef.operationName = 'GetMoviesInList';
exports.getMoviesInListRef = getMoviesInListRef;

exports.getMoviesInList = function getMoviesInList(dcOrVars, vars) {
  return executeQuery(getMoviesInListRef(dcOrVars, vars));
};
