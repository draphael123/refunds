import { Medication } from '@/types';
import cogsData from './cogs-data.json';

// Convert COGS data to Medication format
export const medications: Medication[] = cogsData.map((item, index) => {
  // Extract unit from rxDetails (e.g., "10ML" -> "ml", "6.25 MG" -> "mg")
  const unitMatch = item.rxDetails.match(/(\d+(?:\.\d+)?)\s*(MG|ML|mg|ml|g|G)/i);
  const unit = unitMatch ? unitMatch[2].toLowerCase() : 'units';
  
  // Extract amount from rxDetails
  const amountMatch = item.rxDetails.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  
  // Create a descriptive name
  const name = `${item.treatment} - ${item.rxDetails} (${item.paymentTerm})`;
  
  // Parse payment term to weeks (e.g., "4WKS" -> 4, "12WKS" -> 12)
  const weeksMatch = item.paymentTerm.match(/(\d+)/);
  const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 0;
  
  return {
    id: `cogs-${index}`,
    name,
    treatment: item.treatment,
    category: item.treatment.split('–')[0]?.trim() || item.treatment,
    pharmacy: item.pharmacy,
    price: item.total, // Use total as the price
    unit,
    paymentTerm: item.paymentTerm,
    rxDetails: item.rxDetails,
    perShipmentCost: item.perShipmentCost,
    shipping: item.shipping,
    dispensing: item.dispensing,
    total: item.total,
  };
});
