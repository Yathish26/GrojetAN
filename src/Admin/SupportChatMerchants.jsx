import React from 'react';
import Layout from '../Components/Layout';
import { ChatPane } from './SupportChatCustomers';

export default function SupportChatMerchants(){
  return (
    <Layout title="Live Chat - Merchants">
      <ChatPane channel="merchant" />
    </Layout>
  );
}
