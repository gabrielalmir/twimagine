export interface TwitterMention {
    id: string;
    text: string;
    authorId: string;
    authorUsername: string;
    createdAt: string;
    inReplyToUserId?: string;
    conversationId: string;
}

export interface ImageRequest {
    id: string;
    tweetId: string;
    authorId: string;
    authorUsername: string;
    prompt: string;
    status: 'pending_payment' | 'payment_confirmed' | 'generating' | 'completed' | 'failed';
    paymentIntentId?: string;
    paymentUrl?: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentEvent {
    paymentIntentId: string;
    status: 'succeeded' | 'failed';
    metadata: {
        requestId: string;
        tweetId: string;
    };
}

export interface QueueMessage {
    type: 'generate_image' | 'reply_tweet';
    requestId: string;
    data?: any;
}

export interface DatabaseRecord {
    pk: string;
    sk: string;
    gsi1pk?: string;
    gsi1sk?: string;
    [key: string]: any;
}
