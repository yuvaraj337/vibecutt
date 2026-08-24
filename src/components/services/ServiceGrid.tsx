"use client";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ServiceGrid — VIBE CUT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Responsive 4-col desktop / multi-col tablet /
   single-col mobile grid with 28px column gap and
   32px row gap on desktop.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import React, { useState } from "react";
import { SERVICES_DATA, type ServiceItem } from "@/data/services";
import ServiceCard from "./ServiceCard";

interface ServiceGridProps {
  onSelectService?: (service: ServiceItem) => void;
}

export default function ServiceGrid({ onSelectService }: ServiceGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleBookService = (service: ServiceItem) => {
    setSelectedId(service.id);
    if (onSelectService) {
      onSelectService(service);
    }
  };

  return (
    <div className="services-grid">
      {SERVICES_DATA.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onBookService={handleBookService}
          isSelected={selectedId === service.id}
        />
      ))}
    </div>
  );
}
