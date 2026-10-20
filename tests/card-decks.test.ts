import { expect, it } from 'vitest';
import { cardCategory } from '../src/card-decks';
import type { MethodCard } from '../src/method-model';
const card:MethodCard={id:'sample',kind:'ai-card',title:'Sample',category:'Sees',body:'',sourceUrl:'',version:'1'};
it('places category guides with their capability cards, not in a disconnected guide cluster',()=>{
 expect(cardCategory({...card,category:'Category guides',title:'F · Sample guide'})).toEqual(cardCategory(card));
});
it('keeps supporting technologies and unknown methods visible outside the three AI clusters',()=>{
 expect(cardCategory({...card,category:'Technologies that combine with AI'}).cluster).toBe(3);
 expect(cardCategory({...card,category:'Joker'}).cluster).toBe(3);
 expect(cardCategory({...card,kind:'method',category:'Workshop practice'}).cluster).toBe(4);
});
it('does not mistake a method extract title for a deck category guide',()=>{
 expect(cardCategory({...card,kind:'method',category:'Category guides',title:'A · Workshop'}).cluster).toBe(4);
});
