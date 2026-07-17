import { useState, useEffect } from "react";
import { api } from "../config";
import noImage from "../assets/no-image.png";

export default function Itemcard(props) {
  const [image, setImage] = useState(noImage);

  useEffect(() => {
    if (props.image) {
      // Direct path to file endpoint
      const imgUrl = `${api}/files/${props.image}`;
      setImage(imgUrl);
    } else {
      setImage(noImage);
    }
  }, [props.image]);

  return (
    <a href={"/find/details/" + props.id} data-aos="fade-up">
      <div className="card">
        <div className="card-img">
          <img src={image} alt={props.title} onError={() => setImage(noImage)} />
        </div>
        <div className="card-desc">
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
      </div>
    </a>
  );
}
