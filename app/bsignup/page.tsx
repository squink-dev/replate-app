export default function UserSignUpPage() {
  return (
    <div>
      <h1>Provider Signup</h1>
      <form>
        <input type="text" placeholder="Handle" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}
