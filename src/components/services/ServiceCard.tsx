"use client";

import React from "react";
import { type ServiceItem } from "@/data/services";

interface ServiceCardProps {
  service: ServiceItem;
  onBookService?: (service: ServiceItem) => void;
  isSelected?: boolean;
}

const imageMap: Record<string, string> = {
  "haircut-shave": "/services/haircut-shave.png",
  "haircut-massage": "/services/haircut-massage.png",
  "hair-dye": "/services/hair-dye.png",
  "global-hair-color": "/services/global-hair-color.png",
  "hair-spa": "/services/hair-spa.png",
  "hair-dye-de-tan": "/services/hair-dye-de-tan.png",
  "diamond-facial": "/services/diamond-facial.png",
  "premium-grooming": "/services/premium-grooming.png",
};

const iconFor = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("haircut")) return "✂";
  if (t.includes("massage")) return "♧";
  if (t.includes("wash")) return "⌁";
  if (t.includes("dry")) return "◫";
  if (t.includes("facial") || t.includes("clean")) return "◇";
  if (t.includes("de-tan")) return "◈";
  if (t.includes("color") || t.includes("dye")) return "✧";
  return "✦";
};

export default function ServiceCard({ service, onBookService, isSelected = false }: ServiceCardProps) {
  return (
    <article className={`vc-menu-card ${isSelected ? "is-selected" : ""}`}>
      <div className="vc-menu-card-bg" aria-hidden="true" />
      <img className="vc-menu-card-image" src={imageMap[service.id]} alt="" aria-hidden="true" />
      <div className="vc-menu-card-vignette" aria-hidden="true" />

      <div className="vc-menu-card-content">
        <div className="vc-menu-top">
          <span className="vc-menu-number">{service.number}</span>
          <div className="vc-menu-brand">VIBE CUT<span>MEN&apos;S SALON</span></div>
          {service.isPopular && <span className="vc-menu-badge">POPULAR</span>}
        </div>

        <div className="vc-menu-title-wrap">
          <h3>{service.name}</h3>
          <span className="vc-menu-arrow" />
        </div>

        <ul className="vc-menu-includes">
          {service.includes.map((item) => (
            <li key={item}><span>{iconFor(item)}</span>{item}</li>
          ))}
        </ul>

        <div className="vc-menu-bottom">
          <div className="vc-menu-price"><span>{service.currency}</span>{service.price}</div>
          <button type="button" onClick={() => onBookService?.(service)} className="vc-menu-book">
            BOOK THIS SERVICE <span>→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
