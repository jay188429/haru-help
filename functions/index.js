const { setGlobalOptions } = require("firebase-functions");
setGlobalOptions({ region: "us-central1", maxInstances: 2 });

Object.assign(exports, require("./rag"));
