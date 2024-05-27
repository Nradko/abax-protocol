export type EventTypeDescritpionBodyContent = string | number[] | Record<string, any>;

export interface EventDescriptorBodyItem {
  name: string;
  body?: EventTypeDescritpionBodyContent;
  isResult: boolean;
  isPrimitive: boolean;
}

export interface EventDescriptorBody {
  [key: string]: EventDescriptorBodyItem;
}

export interface EventDescriptor {
  name: string;
  body: EventDescriptorBody;
  isResult: boolean;
  isPrimitive: boolean;
  signatureTopic: string;
}

export interface EventDataTypeDescriptions {
  [signatureTopic: string]: EventDescriptor;
}
