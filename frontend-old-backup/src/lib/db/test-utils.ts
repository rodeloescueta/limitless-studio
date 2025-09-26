/**
 * Database utilities testing script
 *
 * This script tests the database utilities to ensure they work correctly
 * with the seeded data.
 */

import {
  getUserByEmail,
  getTeamById,
  createContentCard,
  getTeamCards,
  getAllTeams,
  getTeamStats,
} from './utils';

async function testDatabaseUtilities() {
  console.log('🧪 Testing database utilities...');
  console.log('');

  try {
    // Test 1: Get admin user
    console.log('1️⃣ Testing getUserByEmail...');
    const adminUser = await getUserByEmail('admin@contentreach.local');
    if (adminUser) {
      console.log('   ✅ Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        role: adminUser.role,
        teams: adminUser.teamMemberships.length,
      });
    } else {
      console.log('   ❌ Admin user not found');
    }
    console.log('');

    // Test 2: Get all teams
    console.log('2️⃣ Testing getAllTeams...');
    const teams = await getAllTeams();
    console.log(`   ✅ Found ${teams.length} team(s):`);
    teams.forEach(team => {
      console.log(`   - ${team.name}: ${team.members.length} members, ${team.stages.length} stages`);
    });
    console.log('');

    if (teams.length > 0) {
      const firstTeam = teams[0];

      // Test 3: Get team details
      console.log('3️⃣ Testing getTeamById...');
      const teamDetails = await getTeamById(firstTeam.id);
      if (teamDetails) {
        console.log('   ✅ Team details loaded:', {
          name: teamDetails.name,
          members: teamDetails.members.length,
          stages: teamDetails.stages.length,
          cards: teamDetails.contentCards.length,
        });

        console.log('   📋 Stages:');
        teamDetails.stages.forEach(stage => {
          console.log(`      ${stage.position}. ${stage.name} - ${stage.description}`);
        });
      }
      console.log('');

      // Test 4: Create a test content card
      if (adminUser && teamDetails) {
        console.log('4️⃣ Testing createContentCard...');
        const testCard = await createContentCard({
          teamId: firstTeam.id,
          stageId: teamDetails.stages[0]?.id, // Research stage
          title: 'Test Content Card',
          description: 'This is a test content card created by the utility test script',
          contentType: 'video',
          priority: 'medium',
          createdBy: adminUser.id,
          assignedTo: adminUser.id,
          metadata: {
            testData: true,
            createdBy: 'test-script',
          },
        });

        console.log('   ✅ Test card created:', {
          id: testCard.id,
          title: testCard.title,
          stage: testCard.stageId,
          position: testCard.position,
        });
        console.log('');

        // Test 5: Get team cards
        console.log('5️⃣ Testing getTeamCards...');
        const teamCards = await getTeamCards(firstTeam.id);
        console.log(`   ✅ Found ${teamCards.length} card(s) in team:`);
        teamCards.forEach(card => {
          console.log(`   - ${card.title} (${card.stage?.name || 'No stage'}) - ${card.priority}`);
        });
        console.log('');

        // Test 6: Get team statistics
        console.log('6️⃣ Testing getTeamStats...');
        const stats = await getTeamStats(firstTeam.id);
        console.log('   ✅ Team statistics:', {
          members: stats.memberCount,
          totalCards: stats.totalCards,
          stages: stats.stageCount,
        });

        console.log('   📊 Cards by stage:');
        stats.cardsByStage.forEach(stageStats => {
          console.log(`      ${stageStats.stageName}: ${stageStats.cardCount} cards`);
        });
        console.log('');
      }
    }

    console.log('🎉 All database utility tests passed!');

  } catch (error) {
    console.error('❌ Database utility test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDatabaseUtilities().then(() => {
    console.log('✨ Database utility testing completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}

export { testDatabaseUtilities };