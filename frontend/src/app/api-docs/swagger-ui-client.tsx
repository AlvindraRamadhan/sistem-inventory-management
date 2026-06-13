"use client";

import "swagger-ui-react/swagger-ui.css";
import SwaggerUI from "swagger-ui-react";

export function SwaggerUIClient() {
  return (
    <SwaggerUI url="https://api.swaggerhub.com/apis/universitasahmaddahl/sistem-inventory-api/1.0.0" docExpansion="list" defaultModelsExpandDepth={1} />
  );
}
