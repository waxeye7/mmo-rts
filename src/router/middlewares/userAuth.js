// userAuth.js
export default async (_to, _from, next) => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    return next("/login");
  }

  const response = await fetch(`http://localhost:3000/users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    next();
  } else {
    sessionStorage.removeItem("token"); // remove invalid token
    next("/login");
  }
};