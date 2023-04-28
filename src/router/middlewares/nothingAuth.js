export default async (_to, _from, next) => {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    return next();
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL}users/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    next("/");
  } else {
    next();
  }
};
