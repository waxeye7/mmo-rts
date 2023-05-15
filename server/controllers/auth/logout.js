const logout = async (req, res) => {
  try {
    // This will throw an error if the 'token' cookie does not exist
    if (!req.cookies.token) {
      throw new Error('No authentication token cookie found');
    }
    res.clearCookie('token');
    res.status(200).send('Logged out');
  } catch (error) {
    console.error("Error logging out:", error);
    // Send a 500 status code for server errors
    res.status(500).send('Error logging out');
  }
}
module.exports = logout
