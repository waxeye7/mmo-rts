export default async (_to, _from, next) => {
  const token = sessionStorage.getItem("token");
  if (!token) {
    return next();
  }

  const response = await fetch(`http://localhost:3000/users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    next("/");
  } else {
    next();
  }
};
