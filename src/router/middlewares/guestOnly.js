export default async (_to, _from, next) => {
  const response = await fetch(`http://localhost:3000/users/me`, {
    method: "GET",
    credentials: 'include'
  });

  if (response.ok) {
    next("/");
  } else {
    next();
  }
};