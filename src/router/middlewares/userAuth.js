export default async (_to, _from, next) => {
  const response = await fetch(`http://localhost:3000/users/me`, {
    credentials: 'include'
  });

  if (response.ok) {
    next();
  } else {
    next("/login");
  }
};