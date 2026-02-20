'use server';
/**
 * @fileOverview A Genkit flow for generating descriptive property overviews.
 *
 * - generatePropertyDescription - A function that generates a property description based on provided details.
 * - GeneratePropertyDescriptionInput - The input type for the generatePropertyDescription function.
 * - GeneratePropertyDescriptionOutput - The return type for the generatePropertyDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePropertyDescriptionInputSchema = z.object({
  propertyName: z.string().describe('The name of the property.'),
  location: z.string().describe('The location of the property (e.g., city, neighborhood, address).'),
  size: z.string().describe('The size of the property (e.g., 