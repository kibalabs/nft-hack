import React from 'react';

import { Text, Box, PaddingSize, Spacing, Button } from '@kibalabs/ui-react';

import { StatItem } from '../client';
import { useGlobals } from '../globalsContext';

export const StatsOverlay = (): React.ReactElement => {
  const { mdtpClient } = useGlobals();
  const [marketCap, setMarketCap] = React.useState<string>('0');
  const [totalSales, setTotalSales] = React.useState<string>('0');
  const [averagePrice, setAveragePrice] = React.useState<string>('0');

  const updateSats = () => {
    console.log("Stats func on front-end");
    mdtpClient.listStatItems().then((retrievedStatItems: StatItem[]): void => {      
      for (var i = 0; i < retrievedStatItems.length; i++) {        
        if (retrievedStatItems[i].title === 'market_cap') setMarketCap(retrievedStatItems[i].data);
        if (retrievedStatItems[i].title === 'total_sales') setTotalSales(retrievedStatItems[i].data);
        if (retrievedStatItems[i].title === 'average_price') setAveragePrice(retrievedStatItems[i].data);
      }
    })
  };

  return (
    <Box variant='overlay-bottomLeftCutoff' width={'200px'}>
      <Text variant='header6'>{'Stats'}</Text>
      <Text variant='paragraph'>{'Market Cap:'}</Text>
      <Text variant='italic'>{`${marketCap}Ξ ($441.43M)`}</Text>
      <Text variant='paragraph'>{'Total sales:'}</Text>
      <Text variant='italic'>{`${totalSales}`}</Text>
      <Text variant='paragraph'>{'Average price:'}</Text>
      <Text variant='italic'>{`${averagePrice}Ξ ($58,662.11)`}</Text>
      {/* <Button variant={'primary'} text='' iconGutter={PaddingSize.None} iconRight={<KibaIcon iconId='ion-cart' />} target={'https://testnets.opensea.io/collection/mdtp-test-2?embed=true'} /> */}
      <Button variant={'primary'} text='UpdateSats' iconGutter={PaddingSize.None} onClicked={updateSats} />
      <Spacing variant={PaddingSize.Narrow} />      
    </Box>
  );
};

/*
"stats":{
"seven_day_volume":0
"total_volume":0
"seven_day_change":0
"seven_day_sales":0
"total_sales":0
"total_supply":0
"count":0
"num_owners":0
"seven_day_average_price":0
"average_price":0
"num_reports":0
"market_cap":0
}
*/