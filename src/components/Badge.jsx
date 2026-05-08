export default function Badge({ source }) {
  return <span className="tf-badge" data-source={source}>{source}</span>;
}
