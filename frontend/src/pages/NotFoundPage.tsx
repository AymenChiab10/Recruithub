import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="not-found">
      <div>
        <strong>404</strong>
        <h1>Cette page n’est pas dans le pipeline.</h1>
        <p>Revenez à la vue d’ensemble pour reprendre votre parcours.</p>
        <Link className="button button-primary" to="/">Retour au tableau de bord</Link>
      </div>
    </section>
  );
}
