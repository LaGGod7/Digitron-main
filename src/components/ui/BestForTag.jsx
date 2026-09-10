import Icon from "./Icon";

const tagStyles = {
  Home: { cls: "tag-home", icon: "home" },
  Shop: { cls: "tag-shop", icon: "shoppingCart" },
  Parking: { cls: "tag-parking", icon: "mapPin" },
};

export default function BestForTag({ tag }) {
  const style = tagStyles[tag] || { cls: "tag-shop", icon: "mapPin" };
  return (
    <span className={`tag ${style.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <Icon name={style.icon} size={12} />
      {tag}
    </span>
  );
}
