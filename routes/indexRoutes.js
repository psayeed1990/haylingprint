const express = require('express');
const router = express.Router();
router.get('/', (req, res) => {
  res.send(
    'This front end view is in underconstruction. Go to http://haylingprint.co.uk/api/v1 for backend api'
  );
});

module.exports = router;
